import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailRequestProps = {
  to: string;
  subject?: string;
  text: string;
};

export async function POST(req: Request) {
  try {
    const body: EmailRequestProps = await req.json();
    const { to, subject, text } = body;

    const { data, error } = await resend.emails.send({
      from: "Adam <adam@formcn.ai>",
      to: [to],
      subject: subject || "Hello world",
      react: text,
    });

    if (error) {
      console.error(error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error }, { status: 500 });
  }
}
