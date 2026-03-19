import { useEffect } from "react";

export default function WelcomeCard({ onClose, tableId }) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[999]">

      <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-7 w-[85%] max-w-sm text-center shadow-[0_10px_40px_rgba(0,0,0,0.25)] animate-dropExit border border-gray-100">

        {/* IMAGE */}
        <div className="flex justify-center mb-4">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGwIGiNKp-qohxyqkw7H1xYzFwl-p2srT3_w&s"
            alt="food"
            className="w-28 h-28 object-cover rounded-full shadow-lg animate-fadeIn"
          />
        </div>

        {/* TEXT */}
        <h2 className="text-2xl font-bold tracking-wide text-gray-800 animate-fadeIn">
          Welcome to Bhookad Hut
        </h2>

        <p className="text-gray-500 text-sm mt-1 animate-fadeIn">
          Serving happiness on your table
        </p>

        <div className="mt-3 inline-block px-4 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium animate-fadeIn">
          Table {tableId}
        </div>

      </div>
    </div>
  );
}