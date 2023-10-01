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

// This represent the user info i.e the student info
type StudentInfo = Record<{
  id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  course_ids: Vec<string>,
  updated_at: Opt<nat64>;
  created_at: nat64;
}>;

/**
 * This type represents the field of a course information.
 */
type CourseInfo = Record<{
  id: string;
  course_title: string;
  course_description: string;
  course_image: string;
  course_introductory_video_url: string;
  course_benefit: string;
  total_registered: number;
  updated_at: Opt<nat64>;
  created_at: nat64;
}>;

/**
 * This type represents the field of a course lesson info.
 */
type LessonInfo = Record<{
  lesson_title: string;
  lesson_url: string;
  id: string;
  course_id: string;
  created_at: nat64;
}>;

// create course info payload
type CreateCourseInfoPayload = Record<{
  course_title: string;
  course_description: string;
  course_image: string;
  course_introductory_video_url: string;
  course_benefit: string;
}>;

// add lesson payload
type AddLessonPayload = Record<{
  lesson_title: string;
  lesson_url: string;
  course_id: string;
}>;

// create a new user payload
type CreateStudentPayload = Record<{
  user_name: string;
  first_name: string;
  last_name: string;
}>;

// this allow us to store and retrieve all accounts within our canister as an admin only
const courseInfoStorage = new StableBTreeMap<string, CourseInfo>(0, 44, 512);
const studentStorage = new StableBTreeMap<string, StudentInfo>(1, 50, 512);
const courseLessonStorage = new StableBTreeMap<string, LessonInfo>(2, 50, 512);

// this creates a course info
$update;
export function registerCourseInfo(
  payload: CreateCourseInfoPayload
): Result<CourseInfo, string> {
  if (
    !payload.course_title ||
    !payload.course_description ||
    !payload.course_benefit ||
    !payload.course_image ||
    !payload.course_introductory_video_url
  ) {
    return Result.Err<CourseInfo, string>(`Invalid input parameters`);
  }

  try {
    const courseInfo: CourseInfo = {
      id: ic.caller().toString(),
      updated_at: Opt.None,
      total_registered: 0,
      created_at: ic.time(),
      course_title: payload.course_title,
      course_description: payload.course_description,
      course_image: payload.course_image,
      course_introductory_video_url: payload.course_introductory_video_url,
      course_benefit: payload.course_benefit,
    };

    courseInfoStorage.insert(courseInfo.id, courseInfo);
    return Result.Ok<CourseInfo, string>(courseInfo);
  } catch (error) {
    return Result.Err<CourseInfo, string>("Failed to register course info");
  }
}

// this function register / creates a new student
$update;
export function registerStudent(
  payload: CreateStudentPayload
): Result<StudentInfo, string> {
  if (!payload.user_name || !payload.first_name || !payload.last_name) {
    return Result.Err<StudentInfo, string>(`Invalid input parameters`);
  }

  const existingStudent = studentStorage
    .values()
    .find((student) => student.user_name === payload.user_name);
  if (existingStudent) {
    return Result.Err<StudentInfo, string>(
      `Student with the same user_name already exists`
    );
  }

  try {
    const studentInfo: StudentInfo = {
      id: `S${uuidv4()}`,
      updated_at: Opt.None,
      created_at: ic.time(),
      course_ids: [],
      user_name: payload.user_name,
      first_name: payload.first_name,
      last_name: payload.last_name,
    };

    studentStorage.insert(studentInfo.id, studentInfo);
    return Result.Ok<StudentInfo, string>(studentInfo);
  } catch (error) {
    return Result.Err<StudentInfo, string>("Failed to register student info");
  }
}

// this function add lesson to a course
$update;
export function registerCourseLesson(
  payload: AddLessonPayload
): Result<LessonInfo, string> {
  if (!payload.lesson_title || !payload.lesson_url || !payload.course_id) {
    return Result.Err<LessonInfo, string>(
      "Missing required fields in the payload"
    );
  }

  const lessonInfo: LessonInfo = {
    id: `L${uuidv4()}`,
    created_at: ic.time(),
    ...payload,
  };

  if (!courseLessonStorage.get(payload.course_id)) {
    return Result.Err<LessonInfo, string>(
      "Course with the given course_id does not exist"
    );
  }

  try {
    courseLessonStorage.insert(lessonInfo.id, lessonInfo);
  } catch (error) {
    return Result.Err<LessonInfo, string>(
      `Failed to insert lesson info with id ${lessonInfo.id} into courseLessonStorage`
    );
  }

  return Result.Ok<LessonInfo, string>(lessonInfo);
}

// this functions gets all students
$query;
export function getAllStudents(): Result<Vec<StudentInfo>, string> {
  try {
    return Result.Ok(studentStorage.values());
  } catch (error) {
    return Result.Err("Error fetching students");
  }
}

// this functions gets all lessons
$query;
export function getAllLessons(): Result<Vec<LessonInfo>, string> {
  try {
    return Result.Ok(courseLessonStorage.values());
  } catch (error) {
    return Result.Err(`Error fetching lessons: ${error}`);
  }
}

// get all lessons in a particular course
$query;
export function getLessonById(id: string): Result<LessonInfo, string> {
  // Suggestion : Validate the id parameter
  if (typeof id !== "string" || id.trim() === "") {
    return Result.Err<LessonInfo, string>("Invalid id");
  }

  return match(courseLessonStorage.get(id), {
    // Suggestion : Rename the message variable to lesson
    Some: (lesson) => Result.Ok<LessonInfo, string>(lesson),
    None: () =>
      Result.Err<LessonInfo, string>(`a lesson with id=${id} not found`),
  });
}

// Update course when student register for a course
$update;
export function studentRegisterForCourse(
  courseId: string,
  studentId: string
): Result<CourseInfo, string> {
  // Suggestion: Validate the courseId and studentId parameters
  if (typeof courseId !== "string" || courseId.trim() === "") {
    return Result.Err<CourseInfo, string>("Invalid courseId");
  }

  if (typeof studentId !== "string" || studentId.trim() === "") {
    return Result.Err<CourseInfo, string>("Invalid studentId");
  }

  // Check if the student exists
  const student = studentStorage.get(studentId);

  return match(student, {
    Some: (existingStudent) => {
      // Check if the student has already registered for the course
      if (existingStudent.course_ids.includes(courseId)) {
        return Result.Err<CourseInfo, string>(
          `Student with ID ${studentId} has already registered for this course.`
        );
      }

      // The student has not registered for the course
      return match(courseInfoStorage.get(courseId), {
        Some: (course) => {
          const updatedCourse: CourseInfo = {
            ...course,
            updated_at: Opt.Some(ic.time()),
            total_registered: course.total_registered + 1,
          };

          try {
            courseInfoStorage.insert(courseId, updatedCourse);

            // Register the student for the course
            existingStudent.course_ids.push(courseId);
            existingStudent.updated_at = Opt.Some(ic.time());
            studentStorage.insert(studentId, existingStudent);

            return Result.Ok<CourseInfo, string>(updatedCourse);
          } catch (error) {
            return Result.Err<CourseInfo, string>(
              `Failed to insert updatedCourse or student registration into storage`
            );
          }
        },
        None: () =>
          Result.Err<CourseInfo, string>(
            `Course with id=${courseId} not found. Student could not register.`
          ),
      });
    },
    None: () =>
      Result.Err<CourseInfo, string>(
        `Student with ID ${studentId} not found.`
      ),
  });
}





// export function studentRegisterForCourse(
//   courseId: string
// ): Result<CourseInfo, string> {
//   // Suggestion : Validate the id parameter
//   if (typeof courseId !== "string" || courseId.trim() === "") {
//     return Result.Err<CourseInfo, string>("Invalid courseId");
//   }

//   return match(courseInfoStorage.get(courseId), {
//     Some: (course) => {
//       const updatedCourse: CourseInfo = {
//         ...course,
//         updated_at: Opt.Some(ic.time()),
//         total_registered: course.total_registered + 1,
//       };

//       try {
//         courseInfoStorage.insert(courseId, updatedCourse);
//         return Result.Ok<CourseInfo, string>(updatedCourse);
//       } catch (error) {
//         return Result.Err<CourseInfo, string>(
//           `Failed to insert updatedCourse into courseInfoStorage`
//         );
//       }
//     },
//     None: () =>
//       Result.Err<CourseInfo, string>(
//         `Course with id=${courseId} not found. Student could not register.`
//       ),
//   });
// }

// this helps to delete a course by id
$update;
export function deleteCourse(id: string): Result<CourseInfo, string> {
  return match(courseInfoStorage.remove(id), {
    Some: (deletedCourse) => Result.Ok<CourseInfo, string>(deletedCourse),
    None: () =>
      Result.Err<CourseInfo, string>(
        `couldn't delete a course with id=${id}. course not found.`
      ),
  });
}

// this helps to delete a student by id
$update;
export function deleteStudent(id: string): Result<StudentInfo, string> {
  return match(studentStorage.remove(id), {
    Some: (deletedStudent) => Result.Ok<StudentInfo, string>(deletedStudent),
    None: () =>
      Result.Err<StudentInfo, string>(
        `couldn't delete a course with id=${id}. course not found.`
      ),
  });
}

// this helps to delete a lessons by id
$update;
export function deleteLesson(id: string): Result<LessonInfo, string> {
  return match(courseLessonStorage.remove(id), {
    Some: (deletedLesson) => Result.Ok<LessonInfo, string>(deletedLesson),
    None: () =>
      Result.Err<LessonInfo, string>(
        `couldn't delete a lesson with id=${id}. lesson not found.`
      ),
  });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
