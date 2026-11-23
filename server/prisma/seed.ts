
import { prisma } from "../src/config/prisma.js";

const sampleBooks = [
  {
    title: "Clean Code",
    description:
      "A practical guide to writing readable, maintainable, and high-quality software.",
    authors: ["Robert C. Martin"],
  },
  {
    title: "The Pragmatic Programmer",
    description:
      "Practical lessons and techniques for becoming a more effective software developer.",
    authors: ["David Thomas", "Andrew Hunt"],
  },
  {
    title: "Designing Data-Intensive Applications",
    description:
      "An exploration of the principles behind reliable, scalable, and maintainable data systems.",
    authors: ["Martin Kleppmann"],
  },
  {
    title: "Computer Networking: A Top-Down Approach",
    description:
      "An introduction to computer networking concepts, protocols, and architectures.",
    authors: ["James Kurose", "Keith Ross"],
  },
  {
    title: "Operating System Concepts",
    description:
      "A comprehensive introduction to operating system principles and implementation.",
    authors: [
      "Abraham Silberschatz",
      "Peter Baer Galvin",
      "Greg Gagne",
    ],
  },
];

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: "computer-science" },
  });

  if (!category) {
    throw new Error("Computer Science category was not found.");
  }

  const user = await prisma.user.findFirst({
    where: { role: "READER" },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error("No existing reader account was found.");
  }

  for (const bookData of sampleBooks) {
    const existingBook = await prisma.book.findFirst({
      where: { title: bookData.title },
    });

    if (existingBook) {
      console.log(`Skipping existing book: ${bookData.title}`);
      continue;
    }

    const authors = [];

    for (const authorName of bookData.authors) {
      let author = await prisma.author.findFirst({
        where: { name: authorName },
      });

      if (!author) {
        author = await prisma.author.create({
          data: { name: authorName },
        });
      }

      authors.push(author);
    }

    await prisma.book.create({
      data: {
        title: bookData.title,
        description: bookData.description,
        status: "PUBLISHED",
        publishedAt: new Date(),
        category: {
          connect: { id: category.id },
        },
        createdBy: {
          connect: { id: user.id },
        },
        updatedBy: {
          connect: { id: user.id },
        },
        authors: {
          create: authors.map((author) => ({
            author: {
              connect: { id: author.id },
            },
          })),
        },
      },
    });

    console.log(`Created book: ${bookData.title}`);
  }

  console.log("Book seeding completed.");
}

main()
  .catch((error) => {
    console.error("Book seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
