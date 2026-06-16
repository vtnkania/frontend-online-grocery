import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 bg-[#eaf2ff] px-5 py-10 text-slate-800">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 font-bold text-emerald-800">
            <Leaf className="size-5" /> FreshMart
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Premium groceries delivered fresh with a focus on local quality.
          </p>
        </div>
        <FooterLinks title="Shop" links={["Fresh Produce", "Meat & Seafood", "Dairy & Eggs"]} />
        <FooterLinks title="Company" links={["About Us", "Support", "Careers"]} />
        <div>
          <p className="mb-3 font-semibold">Newsletter</p>
          <input className="h-10 w-full rounded-lg border border-emerald-100 px-3 text-sm" placeholder="Email address" />
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
        © 2024 FreshMart. All rights reserved.
      </p>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="mb-3 font-semibold">{title}</p>
      <div className="space-y-2 text-sm text-slate-600">
        {links.map((link) => <Link className="block hover:text-emerald-700" href="/" key={link}>{link}</Link>)}
      </div>
    </div>
  );
}
