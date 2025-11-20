import { Navigate } from "react-router";
import type { Route } from "./+types/_index";
import GreetingHome from "~/components/GreetingHome";
import { useGuestUser } from "~/contexts/guestUserContext";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Memoria de Señas" },
    {
      name: "description",
      content: "¡Bienvenido al juego de Memoria de Señas!",
    },
  ];
}

export default function Home() {
  const { guestUser } = useGuestUser();

  useEffect(() => {
    if (guestUser !== null && guestUser !== undefined) {
      window.location.href = "/game";
      return;
    }
  }, [guestUser]);

  return (
    <>
      <GreetingHome />
    </>
  );
}
