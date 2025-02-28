/* eslint-disable @next/next/no-img-element */
import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";




export default function Home() {
  return (
    <>
    
      <DefaultLayout>
        <div className=" relative">
          {/* <img src="/heroimg.png" alt="" className=" absolute top-[-10%] right-0 overflow-hidden" /> */}
       <div className=" z-10">

       <ECommerce />
       </div>
        </div>
       
      </DefaultLayout>
    </>
  );
}
