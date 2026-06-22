import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../server";

const ActivationPage = () => {
  const { activation_token } = useParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (activation_token) {
      const sendRequest = async () => {
         await axios.post(`${server}/user/activation`, {
            activation_token,
          })
          .then((res)=>{
          console.log(res)
          })
         .catch ((error)=> {
          console.log(error);
          setError(true);
        });
      }
      sendRequest();
    }
  }, [activation_token]);

  return (
  <div style={{
    display: "flex",
    width: "100%",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
  }}>
    {
        error ? (
            <p>your token is expired</p>
        ) : (
            <p>your account has been created successfully!</p>
        )
    }
    </div>
  )
};

export default ActivationPage;
