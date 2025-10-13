import { Box, Typography } from "@mui/material";
import { FiTrendingUp } from "react-icons/fi";

const StatCard = ({ title, value, color, icon: Icon }) => {
  const gradients = {
    pink: "from-pink-100 via-white to-white",
    blue: "from-blue-100 via-white to-white",
    orange: "from-amber-100 via-white to-white",
  };

  const borderColors = {
    pink: "border-r-pink-400",
    blue: "border-r-blue-400",
    orange: "border-r-amber-400",
  };

  const textColors = {
    pink: "text-pink-600",
    blue: "text-blue-600",
    orange: "text-amber-600",
  };

  const iconBg = {
    pink: "bg-pink-500",
    blue: "bg-blue-500",
    orange: "bg-amber-500",
  };

  return (
    <Box
      className={`relative flex flex-col justify-between p-5 rounded-2xl shadow-md border-r-4 ${borderColors[color]} bg-gradient-to-l ${gradients[color]} transition-transform hover:scale-[1.02]`}
    >
      <Box className="flex justify-between items-start">
        <Typography
          variant="subtitle2"
          className={`font-medium ${textColors[color]}`}
        >
          {title}
        </Typography>
        <Box className={`p-2 rounded-xl text-white ${iconBg[color]}`}>
          <Icon size={20} />
        </Box>
      </Box>

      <Typography
        variant="h4"
        className={`font-bold mt-3 ${textColors[color]}`}
      >
        {value}
      </Typography>

      <Box className={`flex items-center text-xs mt-2 ${textColors[color]}`}>
        <FiTrendingUp className="mr-1" />
        8.5% Up from yesterday
      </Box>
    </Box>
  );
};

export default StatCard;
