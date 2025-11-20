import { useState } from "react";
import Swal from "sweetalert2";

const GreetingHome = () => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/start-guest-session`, {
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
    <div className="flex flex-col items-center bg-custom text-white w-screen h-screen justify-center">
      <header className="p-4 bg-red-500 text-white mb-6 rounded">
        <h1 className="text-2xl font-bold">Señas Salvajes</h1>
      </header>
      <h3 className="text-md mt-2">Ingresa tu nombre:</h3>
      <form className="flex flex-col items-center" onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Tu nombre"
          className="mt-2 p-2 rounded text-white border border-white focus:outline-none focus:ring-2 focus:ring-white transition"
        />
        <input
          type="submit"
          value="Iniciar"
          className="ml-2 p-2 text-white font-bold rounded cursor-pointer bg-red-500 hover:bg-red-700 transition mt-4"
        />
      </form>
    </div>
  );
};

export default GreetingHome;
