const ENDPOINT = 'https://api.autentique.com.br/v2/graphql'
const TOKEN = process.env.AUTENTIQUE_TOKEN!

async function gql(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  })
  const text = await res.text()
  console.log('[AUTENTIQUE GQL status]', res.status)
  console.log('[AUTENTIQUE GQL body]', text.slice(0, 500))
  let json: Record<string, unknown>
  try { json = JSON.parse(text) } catch { throw new Error(`Autentique retornou não-JSON (${res.status}): ${text.slice(0, 200)}`) }
  if (json.errors) throw new Error((json.errors as Array<{ message: string }>)[0]?.message ?? 'Erro Autentique')
  return json.data
}

export interface AutentiqueSignatory {
  name: string
  email: string
  action: 'SIGN' | 'APPROVE' | 'WITNESS'
}

export interface AutentiqueDocument {
  id: string
  name: string
  signatures: { public_id: string; email?: string; link?: { short_link: string } }[]
}

/** Cria documento no Autentique via multipart upload (form-data Node.js) */
export async function criarDocumento(
  nome: string,
  pdfBase64: string,
  signatarios: AutentiqueSignatory[],
): Promise<AutentiqueDocument> {
  const mutation = `
    mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(document: $document, signers: $signers, file: $file) {
        id
        name
        signatures {
          public_id
          name
          email
          action { name }
          link { short_link }
        }
      }
    }
  `

  const operations = JSON.stringify({
    query: mutation,
    variables: {
      document: { name: nome },
      signers: signatarios.map(s => ({ name: s.name, email: s.email, action: s.action })),
      file: null,
    },
  })
  const map = JSON.stringify({ '0': ['variables.file'] })

  // FormData/Blob nativos (Node 18+) — o fetch do undici monta o multipart corretamente
  const form = new FormData()
  form.append('operations', operations)
  form.append('map', map)
  const pdfBlob = new Blob([Buffer.from(pdfBase64, 'base64')], { type: 'application/pdf' })
  form.append('0', pdfBlob, `${nome}.pdf`)

  console.log('[AUTENTIQUE CREATE] enviando documento...')
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
    signal: AbortSignal.timeout(45000),
  })

  const text = await res.text()
  console.log('[AUTENTIQUE CREATE status]', res.status)
  console.log('[AUTENTIQUE CREATE body]', text.slice(0, 600))
  let json: Record<string, unknown>
  try { json = JSON.parse(text) } catch { throw new Error(`Autentique createDocument retornou não-JSON (${res.status}): ${text.slice(0, 200)}`) }
  if (json.errors) throw new Error((json.errors as Array<{ message: string }>)[0]?.message ?? 'Erro ao criar documento Autentique')
  return (json.data as Record<string, unknown>).createDocument as AutentiqueDocument
}

/** Assina o documento como o dono do token (Nauta). Recebe o id do DOCUMENTO. Retorna Boolean. */
export async function assinarDocumento(documentId: string): Promise<void> {
  await gql(`
    mutation {
      signDocument(id: "${documentId}")
    }
  `)
}

/** Consulta status de um documento */
export async function consultarDocumento(documentId: string) {
  const data = await gql(`
    query {
      document(id: "${documentId}") {
        id
        name
        status { name }
        signatures {
          public_id
          name
          email
          signed { created_at }
          link { short_link }
        }
        files { signed }
      }
    }
  `)
  return (data as Record<string, unknown>).document
}
