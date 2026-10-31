export interface RoomSpec {
  id: string;
  name: string;
  capacity: number;
  type: "lecture_hall" | "lab" | "seminar" | "auditorium" | "classroom";
  block: string;
  floor: number;
  features: string[];
}

export interface FacultySpec {
  id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  maxWeeklyHours: number;
}

export interface StudentGroupSpec {
  id: string;
  name: string;
  department: string;
  semester: number;
  strength: number;
}

export interface CourseSpec {
  code: string;
  title: string;
  credits: number;
  type: "theory" | "lab" | "hybrid";
  weeklySessionsCount: number;
}
