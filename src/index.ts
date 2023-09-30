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
  
  // this function register / creates a new student
  $update;
  export function registerStudent(
    payload: CreateStudentPayload
  ): Result<StudentInfo, string> {
    const studentInfo: StudentInfo = {
      id: `S${uuidv4()}`,
      updated_at: Opt.None,
      created_at: ic.time(),
      ...payload,
    };
  
    studentStorage.insert(studentInfo.id, studentInfo);
    return Result.Ok<StudentInfo, string>(studentInfo);
  }
  
  // this function add lesson to a course
  $update;
  export function registerCourseLesson(payload: AddLessonPayload): Result<LessonInfo, string> {
    const lessonInfo: LessonInfo = {
      id: `L${uuidv4()}`,
      created_at: ic.time(),
      ...payload,
    };
  
    courseLessonStorage.insert(lessonInfo.id, lessonInfo);
    return Result.Ok<LessonInfo, string>(lessonInfo);
  }
  
  // this functions gets all students
  $query;
  export function getAllStudents(): Result<Vec<StudentInfo>, string> {
    return Result.Ok(studentStorage.values());
  }

    // this functions gets all lessons
    $query;
    export function getAllLessons(): Result<Vec<LessonInfo>, string> {
      return Result.Ok(courseLessonStorage.values());
    }

  // get all lessons in a particular course
  $query;
  export function getLessonInACourse(id: string): Result<LessonInfo, string> {
    return match(courseLessonStorage.get(id), {
      Some: (message) => Result.Ok<LessonInfo, string>(message),
      None: () =>
        Result.Err<LessonInfo, string>(`a lesson with id=${id} not found`),
    });
  }
  
  // Update course when student register for a course
  $update;
  export function studentRegisterCourse(
    courseId: string
  ): Result<CourseInfo, string> {
    return match(courseInfoStorage.get(courseId), {
      Some: (course) => {
        const updatedCourse: CourseInfo = {
          ...course,
          updated_at: Opt.Some(ic.time()),
          total_registered: course.total_registered + 1,
        };
        courseInfoStorage.insert(courseId, updatedCourse);
        return Result.Ok<CourseInfo, string>(updatedCourse);
      },
      None: () =>
        Result.Err<CourseInfo, string>(
          `Student could not register for id=${courseId} course. Try again!`
        ),
    });
  }
  
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
  