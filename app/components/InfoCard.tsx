import React from "react";
import { Info } from "lucide-react";

interface InfoCardProps {
  title: string;
  content: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, content }) => {
  return (
    <div
      className="border border-blue-400 rounded-lg p-4 my-2 shadow-lg bg-blue-50/10"
      style={{ width: "min(600px, 90%)" }}
    >
      <div className="flex items-center mb-2 justify-center">
        <Info size={24} color="#2196F3" />
        <h3 className="text-lg font-bold ml-2 text-blue-400">{title}</h3>
      </div>
      <p className="text-sm text-blue-200 leading-5">{content}</p>
    </div>
  );
};

export default InfoCard;
