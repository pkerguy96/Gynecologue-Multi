const PrintHeader = ({
  name,
  date,
}: {
  name: string;
  date?: string | null;
}) => {
  const location = JSON.parse(
    localStorage.getItem("user_login") || '{"location": ""}'
  ).location;

  const DATE = new Date(date || Date.now());
  return (
    <div className="flex flex-col gap-2 items-center justify-center flex-wrap">
      <div className="flex flex-wrap gap-2">
        <span>Fait a</span>
        <span className="font-bold">{location}</span>
        <span>Le</span>
        <div className="font-bold flex gap-1">
          <span>{DATE.getDate()}</span>
          <span>/</span>
          <span>{DATE.getMonth() + 1}</span>
          <span>/</span>
          <span>{DATE.getFullYear()}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span>Nom et Prenom</span>
        <span className="font-bold">{name}</span>
      </div>
    </div>
  );
};

export default PrintHeader;
