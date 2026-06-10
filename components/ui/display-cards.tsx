"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  badge?: string;
  iconClassName?: string;
  titleClassName?: string;
  onClick?: () => void;
  href?: string;
}

export function DisplayCard({
  className,
  icon,
  title = "Serviço",
  description = "",
  badge,
  titleClassName = "text-[#0BBCD4]",
  onClick,
  href,
}: DisplayCardProps) {
  const Wrapper = href
    ? ({ children, className: cls }: { children: React.ReactNode; className?: string }) => (
        <Link href={href} className={cls}>{children}</Link>
      )
    : ({ children, className: cls }: { children: React.ReactNode; className?: string }) => (
        <div onClick={onClick} className={cls}>{children}</div>
      )

  return (
    <Wrapper
      className={cn(
        "relative flex h-44 w-[22rem] -skew-y-[6deg] select-none flex-col justify-between rounded-2xl border px-5 py-4 transition-all duration-500",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-[#0f0e1a] after:to-transparent after:content-['']",
        "hover:border-[#0BBCD4]/30 [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      {badge && (
        <span className="absolute top-3 right-6 z-10 bg-[#0BBCD4] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          {badge}
        </span>
      )}

      <div>
        <span className="relative inline-flex items-center justify-center rounded-xl p-2"
          style={{ background: 'rgba(11,188,212,0.15)' }}>
          {icon}
        </span>
        <p className={cn("text-base font-bold", titleClassName)}>{title}</p>
      </div>

      <p className="text-sm text-gray-400 leading-snug whitespace-normal line-clamp-3">{description}</p>

      <p className="text-xs font-semibold" style={{ color: '#0BBCD4' }}>
        <span>Saiba mais →</span>
      </p>
    </Wrapper>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards = [] }: DisplayCardsProps) {
  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center animate-in fade-in-0 duration-700">
      {cards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
