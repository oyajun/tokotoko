"use server";

import {
  Class,
  Prisma,
  Question,
  Section,
  SubSection,
  Test,
} from "@prisma/client";
import { prisma } from "@/app/api/prisma_client";

export interface TestFrame {
  test: Test;
  sections: SectionFrame[];
  classes: Class[];
}

export interface SectionFrame {
  section: Section;
  subSections: SubSectionFrame[];
}

export interface SubSectionFrame {
  subSection: SubSection;
  questions: Question[];
}

export interface DeleteTestProps {
  id: number;
}

export const createTest = async (props: TestFrame) => {
  let test: Prisma.TestCreateInput = {
    title: props.test.title,
    summary: props.test.summary,
    startDate: props.test.startDate,
    endDate: props.test.endDate,
    sections: {
      create: props.sections.map((section) => {
        return {
          summary: section.section.summary,
          number: section.section.number,
          subSections: {
            create: section.subSections.map((subSection) => {
              return {
                summary: subSection.subSection.summary,
                number: subSection.subSection.number,
                questions: {
                  create: subSection.questions.map((question) => {
                    return {
                      question: question.question,
                      number: question.number,
                      answer: question.answer,
                    };
                  }),
                },
              };
            }),
          },
        };
      }),
    },
    classes: {
      connect: props.classes.map((i) => {
        return {
          id: i.id,
        };
      }),
    },
  };
  console.log(JSON.stringify(test.sections));
  await prisma.test.create({ data: test });
};

export const removeTest = async (props: DeleteTestProps) => {
  await prisma.section
    .findMany({
      where: {
        testId: props.id,
      },
      select: {
        id: true,
      },
    })
    .then((section) => {
      section
        .map((s) => {
          return prisma.subSection.findMany({
            where: {
              sectionId: s.id,
            },
            select: {
              id: true,
            },
          });
        })
        .map(async (subsection) => {
          subsection.then((i) => {
            return i.map(async (_) => {
              subsection.then((i) => {
                prisma.question
                  .deleteMany({
                    where: {
                      subSectionId: {
                        in: i.map((j) => {
                          return j.id;
                        }),
                      },
                    },
                  })
                  .then(async (_) => {
                    await prisma.subSection
                      .deleteMany({
                        where: {
                          sectionId: {
                            in: section.map((i) => {
                              return i.id;
                            }),
                          },
                        },
                      })
                      .then(async (_) => {
                        await prisma.section
                          .deleteMany({
                            where: {
                              testId: props.id,
                            },
                          })
                          .then(async (_) => {
                            await prisma.test.deleteMany({
                              where: { id: props.id },
                            });
                          });
                      });
                  });
              });
            });
          });
        });
    });
};

export const getTest = async () => {
  const test = await prisma.test.findFirst();
  console.log(test);
  return test;
};

// no info about sections ...
export const getTestByClass = async (classId: number) => {
  return prisma.test.findMany({
    where: {
      classes: {
        some: {
          id: classId,
        },
      },
    },
  });
};
