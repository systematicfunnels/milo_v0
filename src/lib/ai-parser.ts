import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const reminderSchema = {
  type: SchemaType.OBJECT,
  properties: {
    message: {
      type: SchemaType.STRING,
      description: "The actual reminder message/task to remind about",
    },
    date: {
      type: SchemaType.STRING,
      description: "Date in YYYY-MM-DD format",
    },
    time: {
      type: SchemaType.STRING,
      description: "Time in HH:MM format (24-hour)",
    },
    location: {
      type: SchemaType.STRING,
      description: "Location if mentioned, otherwise empty string",
      nullable: true,
    },
    is_reminder: {
      type: SchemaType.BOOLEAN,
      description: "Whether this message is a valid reminder request",
    },
    error_message: {
      type: SchemaType.STRING,
      description: "Error message if the request is invalid or unclear",
      nullable: true,
    },
  },
  required: ["message", "date", "time", "is_reminder"],
};

export interface ParsedReminder {
  message: string;
  date: string;
  time: string;
  location?: string | null;
  is_reminder: boolean;
  error_message?: string | null;
}

export async function parseReminderFromNaturalLanguage(
  userMessage: string,
  userTimezone: string = "Asia/Kolkata"
): Promise<ParsedReminder> {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const currentDate = `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
  const currentTime = `${parts.find((p) => p.type === "hour")?.value}:${parts.find((p) => p.type === "minute")?.value}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: reminderSchema,
    },
  });

  const prompt = `You are a smart reminder assistant. Parse the user's message to extract reminder details.

Current date: ${currentDate}
Current time: ${currentTime}
User timezone: ${userTimezone}

User message: "${userMessage}"

Instructions:
- Extract what the user wants to be reminded about (the task/message)
- Calculate the correct date and time based on relative terms like "tomorrow", "in 2 hours", "next Monday", "at 3pm", etc.
- If user says "tomorrow at 3pm", calculate tomorrow's date and use 15:00
- If user says "in 30 minutes", add 30 minutes to current time
- If user says "next week Monday", calculate that date
- Support both English and Hindi language inputs
- If the message is not a reminder request (e.g., "hello", "what can you do?"), set is_reminder to false
- If time is ambiguous (e.g., "3" without am/pm), assume PM for times 1-6, AM for times 7-12
- Extract location if mentioned (e.g., "remind me to buy groceries at the supermarket")

Examples:
- "remind me tomorrow at 3pm to call mom" → message: "call mom", date: [tomorrow's date], time: "15:00"
- "याद दिलाओ कल सुबह 9 बजे दवाई लेनी है" → message: "दवाई लेनी है", date: [tomorrow's date], time: "09:00"
- "set reminder for meeting in 2 hours" → message: "meeting", date: [today], time: [current + 2 hours]
- "hello" → is_reminder: false, error_message: "This doesn't look like a reminder request"`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const parsed = JSON.parse(response) as ParsedReminder;
    return parsed;
  } catch (error) {
    console.error("AI parsing error:", error);
    return {
      message: userMessage,
      date: "",
      time: "",
      is_reminder: false,
      error_message: "Failed to parse your message. Please try: 'remind me [when] to [task]'",
    };
  }
}
