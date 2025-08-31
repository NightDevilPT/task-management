"use client";

import { useLanguage } from "@/components/providers/language-provider";

export default function Home() {
	const { dictionary } = useLanguage();
	return <div className="w-full h-auto">{dictionary?.welcome}</div>;
}
