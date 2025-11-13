import React from "react";
import { Link } from "react-router-dom";
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      {" "}
      <div className="text-center bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-md w-full">
        {" "}
        {/* 404 Number */}{" "}
        <h1 className="text-8xl font-bold text-red-500 mb-2">404</h1>{" "}
        {/* Title */}{" "}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-3">
          {" "}
          Page Not Found{" "}
        </h2>{" "}
        {/* Description */}{" "}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {" "}
          Sorry, the page you're looking for doesn't exist. It might have been
          moved or deleted.{" "}
        </p>{" "}
        {/* Back to Home Button */}{" "}
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200 shadow-md hover:shadow-lg"
        >
          {" "}
          Go Back Home{" "}
        </Link>{" "}
      </div>{" "}
    </div>
  );
};
export default NotFoundPage;
