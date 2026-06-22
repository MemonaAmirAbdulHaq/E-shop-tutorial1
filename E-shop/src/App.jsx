import React  from "react";
import "./index.css"
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {LoginPage, SignupPage, ActivationPage} from "./Routes"


export default function App() {


  return (
   <BrowserRouter>
   <Routes>
    <Route path='/login' element={<LoginPage/> }/>
    <Route path='/sign-up' element={<SignupPage/> }/>
    <Route path='/activation/:activation_token' element={<ActivationPage/> }/>
   </Routes>
   </BrowserRouter>
  );
}