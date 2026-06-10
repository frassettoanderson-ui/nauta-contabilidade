const ENDPOINT = 'https://api.autentique.com.br/2/graphql'
const TOKEN = process.env.AUTENTIQUE_TOKEN!

async function gql(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'Erro Autentique')
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
  signatures: { public_id: string; link?: { short_link: string } }[]
}

/** Cria documento no Autentique e retorna o objeto criado */
export async function criarDocumento(
  nome: string,
  pdfBase64: string,
  signatarios: AutentiqueSignatory[],
): Promise<AutentiqueDocument> {
  const mutation = `
    mutation CreateDocument($document: DocumentInput!, $signatories: [SignatoryInput!]!, $file: Upload!) {
      createDocument(document: $document, signatories: $signatories, file: $file) {
        id
        name
        signatures {
          public_id
          name
          email { email }
          action { name }
          link { short_link }
        }
      }
    }
  `

  // Autentique aceita upload via multipart (arquivo como base64 em variável Upload)
  const formData = new FormData()
  const operations = JSON.stringify({
    query: mutation,
    variables: {
      document: { name: nome, reminder: false, sortable: false },
      signatories: signatarios.map(s => ({ name: s.name, email: s.email, action: s.action })),
      file: null,
    },
  })
  const map = JSON.stringify({ '0': ['variables.file'] })

  // Converte base64 para Blob
  const binary = Buffer.from(pdfBase64, 'base64')
  const blob = new Blob([binary], { type: 'application/pdf' })

  formData.append('operations', operations)
  formData.append('map', map)
  formData.append('0', blob, `${nome}.pdf`)

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: formData,
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'Erro ao criar documento Autentique')
  return json.data.createDocument
}

/** Assina usando o public_id da assinatura (retornado em createDocument) */
export async function assinarDocumento(publicId: string): Promise<void> {
  await gql(`
    mutation {
      signDocument(public_id: "${publicId}") { id }
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
  return data.document
}
