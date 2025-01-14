import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { Data, Error, Links, Meta } from "./../../../common/type/todoTypeApi";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | Data
    | Error
    | { data: Data[]; meta: Meta; link: Links }
    | { progress: number; completed: number; recent: Data[] }
  >
) {
  const requestMethod = req.method;
  switch (requestMethod) {
    case "GET":
      try {
        const start = new Date(req.query.start as string); // 2023-01-28
        const day = start.getUTCDate() - 1;
        start.setDate(day);
        const end = new Date(req.query.end as string); // 2023-01-30
        const endDay = end.getUTCDate() + 1;
        end.setDate(endDay);
        const filter = req.query.filter;
        const data = await prisma.todo.findMany({
          where: {
            OR: [{ createdAt: { gte: start, lte: end } }],
          },
        });
        const recentData = await prisma.todo.findMany({
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
          where: {
            OR: [{ createdAt: { gte: start, lte: end } }],
          },
        });
        const compltedData = data.filter(
          (todo) => todo.isCompleted == true
        ).length;
        const progressData = data.filter(
          (todo) => todo.isCompleted == false
        ).length;
        return res.status(200).json({
          completed: compltedData,
          progress: progressData,
          recent: recentData,
        });
      } catch (error) {
        return res.status(400).json({ status: 400, message: "Bad request!" });
      }
    default:
      return res.status(405).json({ message: "Method not allow", status: 405 });
  }
}

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
    externalResolver: true,
  },
};
