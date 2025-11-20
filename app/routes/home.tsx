import type { Route } from "./+types/home";
import GreetingHome from "~/components/GreetingHome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Señas salvajes" },
    { name: "description", content: "¡Bienvenido a Señas Salvajes!" },
  ];
}

export default function Home() {
  return (
    <>
      <GreetingHome />
      <main></main>
      <footer></footer>
    </>
  );
}
