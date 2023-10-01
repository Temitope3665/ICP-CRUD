// cannister code goes here
import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
} from "azle";
import { v4 as uuidv4 } from "uuid";

}

// ... Imports and type definitions as before ...

// Helper function for input validation
function isValidString(str: string): boolean {
  return typeof str === 'string' && str.trim() !== '';
}

// Helper function for input validation
function isValidUrl(url: string): boolean {
  // You can implement a URL validation logic here
  // For simplicity, we assume any non-empty string is a valid URL
  return typeof url === 'string' && url.trim() !== '';
}

// Helper function for error handling with meaningful error messages
function handleError<T>(errorMessage: string): Result<T, string> {
  console.error(errorMessage);
  return Result.Err<T, string>(errorMessage);
}

// ... BTreeMaps and crypto setup as before ...

$update;
export function registerCourseInfo(
  payload: CreateCourseInfoPayload
): Result<CourseInfo, string> {
  if (!isValidString(payload.course_title)) {
    return handleError('Invalid course title.');
  }

  if (!isValidString(payload.course_description)) {
    return handleError('Invalid course description.');
  }

  if (!isValidString(payload.course_image)) {
    return handleError('Invalid course image URL.');
  }

  if (!isValidString(payload.course_introductory_video_url)) {
    return handleError('Invalid introductory video URL.');
  }

  if (!isValidString(payload.course_benefit)) {
    return handleError('Invalid course benefit.');
  }

  const courseInfo: CourseInfo = {
    id: ic.caller().toString(),
    updated_at: Opt.None,
    total_registered: 0,
    created_at: ic.time(),
    ...payload,
  };

  courseInfoStorage.insert(courseInfo.id, courseInfo);
  return Result.Ok<CourseInfo, string>(courseInfo);
}

// Implement similar input validation and error handling for other functions...

$update;
export function registerStudent(
  payload: CreateStudentPayload
): Result<StudentInfo, string> {
  // Input validation for student registration...
}

$update;
export function registerCourseLesson(
  payload: AddLessonPayload
): Result<LessonInfo, string> {
  // Input validation for lesson registration...
}

$query;
export function getAllStudents(): Result<Vec<StudentInfo>, string> {
  return Result.Ok(studentStorage.values());
}

// Implement similar input validation and error handling for other query functions...

$update;
export function studentRegisterCourse(
  courseId: string
): Result<CourseInfo, string> {
  // Input validation for student registration to a course...
}

$update;
export function deleteCourse(id: string): Result<CourseInfo, string> {
  // Input validation for deleting a course...
}

$update;
export function deleteStudent(id: string): Result<StudentInfo, string> {
  // Input validation for deleting a student...
}

$update;
export function deleteLesson(id: string): Result<LessonInfo, string> {
  // Input validation for deleting a lesson...
}
