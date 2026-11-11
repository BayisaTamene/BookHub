
import type { Book } from "../types/book";

export const books: Book[] = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    coverColor: "bg-amber-100",
    description:
      "A practical guide to building good habits, breaking bad ones, and making small improvements that lead to remarkable results.",
    publishedYear: 2018,
    pages: 320,
  },
  {
    id: 2,
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    coverColor: "bg-yellow-100",
    description:
      "A philosophical novel about a young shepherd who travels in search of treasure and discovers the importance of following his dreams.",
    publishedYear: 1988,
    pages: 208,
  },
  {
    id: 3,
    title: "Deep Work",
    author: "Cal Newport",
    category: "Productivity",
    coverColor: "bg-blue-100",
    description:
      "Explores the value of focused, distraction-free work and presents strategies for developing this ability in a world full of interruptions.",
    publishedYear: 2016,
    pages: 304,
  },
  {
    id: 4,
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    category: "Finance",
    coverColor: "bg-green-100",
    description:
      "Explores different attitudes toward money, financial education, assets, and building long-term financial independence.",
    publishedYear: 1997,
    pages: 336,
  },
];
