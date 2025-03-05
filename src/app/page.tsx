/* eslint-disable @next/next/no-img-element */
import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Link from "next/link";




export default function Home() {
  return (
    <>
    
      <DefaultLayout>
        <h1>test</h1>

        <Link href={'/four-meme'}>lest go</Link>
      </DefaultLayout>
    </>
  );
}
