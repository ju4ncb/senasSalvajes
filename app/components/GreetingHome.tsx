import { useState } from "react";
import Swal from "sweetalert2";
import InfoCard from "./InfoCard";

const GreetingHome = () => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/start-guest-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });
    if (res.ok) {
      window.location.href = "/game";
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un error con el servidor. Por favor, intenta de nuevo.",
      });
    }
  };
  const [username, setUsername] = useState("");
  return (
    <div className="flex flex-col items-center w-screen h-screen justify-center">
      <header className="p-4 bg-red-500 text-white mb-6 rounded">
        <h1 className="text-2xl font-bold">MEMORIA DE SEÑAS</h1>
      </header>
      <div className="flex flex-col items-center text-red-50 justify-center bg-white/10 p-4 rounded-lg shadow-lg">
        <InfoCard
          title="Advertencia"
          content="El usuario que crees es un invitado, no es posible volver a acceder al mismo usuario de nuevo una vez entres al juego."
        />
        <h3 className="text-md mt-2">Ingresa tu User:</h3>
        <form className="flex flex-col items-center" onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tu username"
            className="mt-2 p-2 rounded text-white border border-white focus:outline-none focus:ring-2 focus:ring-white transition"
          />
          <input
            type="submit"
            value="Iniciar"
            className="ml-2 p-2 text-white font-bold rounded cursor-pointer bg-red-500 hover:bg-red-700 transition mt-4"
          />
        </form>
      </div>
    </div>
  );
};

export default GreetingHome;
