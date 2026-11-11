
import {
  Code2,
  Cpu,
  FlaskConical,
  BriefcaseBusiness,
  Landmark,
  BookOpen,
} from 'lucide-react'

interface Category {
  id: number
  name: string
  description: string
  icon: React.ElementType
}

const categories: Category[] = [
  {
    id: 1,
    name: 'Programming',
    description: 'Software development and coding',
    icon: Code2,
  },
  {
    id: 2,
    name: 'Technology',
    description: 'Computers and innovation',
    icon: Cpu,
  },
  {
    id: 3,
    name: 'Science',
    description: 'Scientific knowledge and research',
    icon: FlaskConical,
  },
  {
    id: 4,
    name: 'Business',
    description: 'Management and entrepreneurship',
    icon: BriefcaseBusiness,
  },
  {
    id: 5,
    name: 'History',
    description: 'Historical events and civilizations',
    icon: Landmark,
  },
  {
    id: 6,
    name: 'Literature',
    description: 'Novels, poetry and fiction',
    icon: BookOpen,
  },
]

function Categories() {
  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">

        {/* Section heading */}
        <div className="mb-10 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Explore your interests
          </span>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Browse by Category
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Find books across different subjects and discover knowledge
            that matches your interests.
          </p>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {categories.map((category) => {
            const Icon = category.icon

            return (
              <article
                key={category.id}
                className="group rounded-xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon size={26} strokeWidth={1.8} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {category.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {category.description}
                </p>
              </article>
            )
          })}

        </div>
      </div>
    </section>
  )
}

export default Categories
