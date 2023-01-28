import httpUtils from "@/common/utils/httpUtils";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { Data, Error, Links, Meta } from "./../../../common/type/todoTypeApi";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error | { data: Data[]; meta: Meta; link: Links }>
) {
  const requestMethod = req.method;
  switch (requestMethod) {
    case "POST":
      try {
        const body = req?.body;
        const newData = await prisma.todo.create({
          data: {
            todo: body?.todo,
            isCompleted: body?.isCompleted ?? false,
          },
        });
        return res.status(201).json({
          ...newData,
          //createdAt: moment(newData?.createdAt).format("DD/MM/YYYY h:mm A"),
        });
      } catch (error) {
        return httpUtils.parseError(error as any).then((err) => {
          if (err?.status == 0)
            return res.status(400).json({
              status: 400,
              message: "Unique constraint failed on the fields: (`todo`)",
            });
          else
            return res
              .status(400)
              .json({ status: 400, message: "Bad request!" });
        });
      }
    case "PUT":
      try {
        console.log("put body :::", req?.body);
        const newData = req?.body;
        return res.status(201).json(newData);
      } catch (error) {
        return res.status(400).json({ status: 400, message: "Bad request!" });
      }
    case "GET":
      try {
        const cursor = req.query.cursor ?? "";
        const limit = req.query.limit ?? 20;
        const cursorObject =
          cursor == "" ? undefined : { id: parseInt(cursor as string) };
        const data = await prisma.todo.findMany({
          take: parseInt(limit as string), // Page size
          cursor: cursorObject,
          orderBy: {
            id: "asc", // Ordering results
          },
        });

        const nextCursor =
          data?.length == limit ? data[data.length - 1].id + 1 : undefined;
        return res.status(200).json({
          data: data,
          meta: { per_page: 20, current_page: 1, path: "/api/todo" },
          link: {
            prev: `/api/todo?cursor=${data[0].id}&limit=${limit}`,
            next: `/api/todo?cursor=${nextCursor}&limit=${limit}`,
          },
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