import { useState, useRef, useEffect } from "react";
import menuData from "../data/menuData";

export default function Navbar({ onSearch }) {

  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const menuRef = useRef(null);

  const handleSearch = (e) => {

    const value = e.target.value;
    setSearch(value);

    if (onSearch) {
      onSearch(value);
    }

    if (value.trim() === "") {
      setSuggestions([]);
      return;
    }

    const allItems = menuData.flatMap(cat => cat.items);

    const filtered = allItems
      .filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(filtered);

  };

  const selectSuggestion = (name) => {

    setSearch(name);
    setSuggestions([]);

    if (onSearch) {
      onSearch(name);
    }

  };

  const clearSearch = () => {

    setSearch("");
    setSuggestions([]);

    if (onSearch) {
      onSearch("");
    }

  };

  // CLOSE MENU WHEN CLICK OUTSIDE
  useEffect(() => {

    const handleClickOutside = (event) => {

      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }

    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };

  }, []);

  return (

    <div className="sticky top-0 z-50 bg-white border-b shadow-sm">

      <div className="flex items-center justify-between px-4 py-3">

        {/* LEFT : LOGO + NAME */}
        <div className="flex items-center gap-2">

          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGwIGiNKp-qohxyqkw7H1xYzFwl-p2srT3_w&s"
            alt="Bhukkad Hai"
            className="w-9 h-9 rounded-lg object-cover"
          />

          <h1 className="font-bold text-lg">
            Bhukkad
          </h1>

        </div>


        {/* CENTER : SEARCH */}
        <div className="relative w-32">

          {/* SEARCH ICON */}
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={handleSearch}
            className="w-full border rounded-full pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          {/* CLEAR BUTTON */}
          {search && (
            <i
              className="fa-solid fa-xmark absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-red-500"
              onClick={clearSearch}
            ></i>
          )}

          {/* SEARCH SUGGESTIONS */}
          {suggestions.length > 0 && (

            <div className="absolute top-11 left-0 w-full bg-white border rounded-lg shadow-lg z-50">

              {suggestions.map(item => (

                <div
                  key={item.id}
                  onClick={() => selectSuggestion(item.name)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {item.name}
                </div>

              ))}

            </div>

          )}

        </div>


        {/* RIGHT : ICONS */}
        <div className="flex items-center gap-5 relative" ref={menuRef}>

          {/* INSTAGRAM */}
          <a
            href="https://www.instagram.com/nomadic__jatin/"
            target="_blank"
          >
            <img
              src="https://img.freepik.com/premium-psd/instagram-logo_971166-164497.jpg?semt=ais_rp_50_assets&w=740&q=80"
              alt="Instagram"
              className="w-8 h-8 hover:scale-110 transition"
            />
          </a>

          {/* CALL */}
          <a href="tel:+917983202009" target="_blank">
            <img
              src="https://static.vecteezy.com/system/resources/previews/036/269/966/non_2x/phone-call-icon-answer-accept-call-icon-with-green-button-contact-us-telephone-sign-yes-button-incoming-call-icon-vector.jpg"
              alt="Call"
              className="w-8 h-8 hover:scale-110 transition"
            />
          </a>

          {/* THREE DOT MENU */}
          <i
            className="fa-solid fa-ellipsis-vertical text-lg cursor-pointer"
            onClick={() => setShowMenu(!showMenu)}
          ></i>


          {/* DROPDOWN MENU */}
          {showMenu && (

            <div className="absolute right-0 top-10 bg-white shadow-lg border rounded-lg w-40 py-2">

              <a
                href="#"
                className="block px-4 py-2 hover:bg-gray-100 text-sm"
              >
                About
              </a>

              <a
                href="tel:+919999999999"
                className="block px-4 py-2 hover:bg-gray-100 text-sm"
              >
                Contact
              </a>

              <a
                href="https://wa.me/919999999999"
                target="_blank"
                className="block px-4 py-2 hover:bg-gray-100 text-sm"
              >
                WhatsApp
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                className="block px-4 py-2 hover:bg-gray-100 text-sm"
              >
                Instagram
              </a>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}