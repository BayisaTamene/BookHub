import Hero from "../components/Hero"
import FeaturedBooks from "../components/FeaturedBooks"
import Categories from "../components/Categories"
import PopularBooks from "../components/PopularBooks"
import Newsletter from "../components/Newsletter"

function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturedBooks />
      <Categories />
      <PopularBooks />
      <Newsletter />
    </main>
  )
}

export default HomePage