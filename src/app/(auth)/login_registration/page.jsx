
"use client"

import { useState } from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import LoginForm from "@/components/auth/LoginForm";

const Login_registration = () => {
    const [tab, toggleTab] = useState("login")

    return (
        <div className="fixed z-502 top-0 bg-amber-50 w-screen h-screen flex justify-center items-center  ">


            {tab === "login" ? <LoginForm /> : <SignUpForm />}



        </div>


    )
}

export default Login_registration;