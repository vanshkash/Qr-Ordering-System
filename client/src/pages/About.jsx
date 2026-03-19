import React from "react";
import { useNavigate, useParams } from "react-router-dom";
function About() {
  const navigate = useNavigate();
   const { tableId } = useParams();

  return (
    <div className="bg-[#0f0f0f] text-white">

      {/* HERO SECTION */}
<section className="relative h-[60vh] flex items-center justify-center text-center">

  <button
      onClick={() => navigate(`/menu/${tableId}`)}
      className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full"
    >
      ← Back
    </button>

  <img
    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrMLR7eVe2LHEvjOVqRXUn0OQssDoHj3SVBQ&s"
    className="absolute w-full h-full object-cover blur-sm"
  />

  <div className="absolute inset-0 bg-black/40"></div>

  <div className="relative z-10 px-6">
    <h1 className="text-5xl font-bold mb-4">
      Welcome to Bhukkad
    </h1>

    <p className="text-lg text-gray-300 max-w-xl mx-auto">
      One of Hapur's favorite food destinations where delicious flavors,
      cozy ambience and unforgettable dining experiences come together.
    </p>
  </div>

</section>

      {/* ABOUT SECTION */}
      <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-10 items-center">

        <img
          src="https://content.jdmagicbox.com/comp/hapur/a6/9999px122.x122.221019182133.u9a6/catalogue/-rrptwwuyyn.jpg"
          alt="restaurant interior"
          className="rounded-xl shadow-lg"
        />

        <div>
          <h2 className="text-3xl font-semibold mb-4">Our Story</h2>

          <p className="text-gray-300 mb-4">
            Bhukkad started with a simple idea — serve tasty and satisfying food
            for every food lover. Inspired by India's vibrant street food culture,
            Bhukkad blends authentic flavors with modern recipes to create dishes
            that people love.
          </p>

          <p className="text-gray-300">
            Whether you're visiting with friends, family, or just craving
            comfort food, Bhukkad offers a warm and welcoming dining experience
            filled with flavor and happiness.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#161616] py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">

          <h2 className="text-3xl font-semibold mb-12">
            Why People Love Bhukkad
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-[#1f1f1f] p-8 rounded-xl hover:scale-105 transition">
              <h3 className="text-xl font-semibold mb-3">Fresh Ingredients</h3>
              <p className="text-gray-400">
                Every dish is prepared using fresh ingredients and authentic
                spices to deliver rich flavors.
              </p>
            </div>

            <div className="bg-[#1f1f1f] p-8 rounded-xl hover:scale-105 transition">
              <h3 className="text-xl font-semibold mb-3">Variety of Food</h3>
              <p className="text-gray-400">
                From chaap specials and Chinese dishes to snacks and Indian
                meals, Bhukkad has something for everyone.
              </p>
            </div>

            <div className="bg-[#1f1f1f] p-8 rounded-xl hover:scale-105 transition">
              <h3 className="text-xl font-semibold mb-3">Great Ambience</h3>
              <p className="text-gray-400">
                Enjoy a cozy and vibrant restaurant environment perfect for
                friends, family and food lovers.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOD GALLERY */}
      <section className="max-w-6xl mx-auto py-16 px-6">

        <h2 className="text-3xl font-semibold text-center mb-12">
          Our Delicious Food
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <img
            src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
            className="rounded-lg"
          />

          <img
            src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe"
            className="rounded-lg"
          />

          <img
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"
            className="rounded-lg"
          />

        </div>
      </section>

      {/* FOOTER */}
      <section className="bg-[#161616] text-center py-10">
        <h3 className="text-xl font-semibold mb-2">Bhukkad – Hapur</h3>
        <p className="text-gray-400">
          Great food brings people together.
        </p>
      </section>

    </div>
  );
}

export default About;