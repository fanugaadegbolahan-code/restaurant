import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="mt-auto flex items-center justify-between border-t border-[#e6d8c8] px-4 py-6 text-[0.68rem] uppercase tracking-[0.16em] text-[#6d6258] md:px-8">
      <Link href="/" className="font-[family-name:var(--font-display)] text-2xl tracking-[0.2em] text-[#2c241f] normal-case">
        Massino
      </Link>
      <p>&copy; Massino. All rights reserved.</p>
    </footer>
  )
}

export default Footer
