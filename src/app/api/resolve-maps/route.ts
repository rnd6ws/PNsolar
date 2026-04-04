import { resolveMapsInfo } from "@/lib/maps/resolveMapsInfo";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url || typeof url !== "string") {
            return Response.json({ error: "Thiếu URL" }, { status: 400 });
        }

        const result = await resolveMapsInfo(url.trim());
        return Response.json(result);
    } catch (err: any) {
        return Response.json({ error: err.message ?? "Không thể xử lý link" }, { status: 422 });
    }
}
