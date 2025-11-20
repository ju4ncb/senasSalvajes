const Footer = () => {
  return (
    <footer className="mt-12 mb-8 w-full max-w-[600px]">
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h3 className="text-center text-lg font-semibold mb-4">Creado por</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Juan Caballero",
            "Jesús Castro",
            "Jesús Carbonó",
            "Mariana Díaz",
            "Pedro Ruiz",
          ].map((name, index) => (
            <div
              key={index}
              className="bg-white/10 px-4 py-2 rounded border border-white/20"
            >
              <span className="text-sm text-white">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
