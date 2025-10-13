import { Avatar, Box, Typography } from "@mui/material";

const TopBar = () => {
  return (
    <Box className="flex justify-end items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
      <div className="relative">
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">6</span>
        <button className="text-gray-600 hover:text-purple-600 transition-colors cursor-pointer">
          🔔
        </button>
      </div>

      <Box className="flex items-center gap-3 cursor-pointer">
        <Avatar
          alt="Ck"
          src="/path/to/avatar.jpg" 
          sx={{
            bgcolor: "#8b5cf6", 
            width: 40,
            height: 40,
            fontSize: "1rem",
          }}
        >
          C
        </Avatar>
        <Box className="flex flex-col leading-tight">
          <Typography variant="subtitle2" className="text-gray-800 font-semibold">
            Ck
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            Admin
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TopBar;
