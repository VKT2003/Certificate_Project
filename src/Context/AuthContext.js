import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [courseId, setCourseId] = useState(null);
    const [courses, setCourses] = useState([]);
    const [isCourseCompleted, setIsCourseCompleted] = useState(false);
    const [matchedCourse, setMatchedCourse] = useState(null);

    // ✅ Get query params from the URL
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const playlistId = params.get("playListId");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, courseRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/getUserById/${userId}`),
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/courses/getCourses/${userId}`)
                ]);

                const fetchedCourses = Array.isArray(courseRes.data)
                    ? courseRes.data
                    : [];

                setUser(userRes.data);
                setCourses(fetchedCourses);
                setCourseId(playlistId);

                // ✅ Check for course completion here
                const foundCourse = fetchedCourses.find(course => course.playListId === playlistId);

                if (foundCourse) {
                    console.log("Matched course:", foundCourse);
                    setIsCourseCompleted(foundCourse.isCompleted);
                    setMatchedCourse(foundCourse);
                } else {
                    console.log("No matching course found");
                }

            } catch (error) {
                console.error("Error fetching user or courses:", error);
            }
        };

        fetchData();
    }, [userId, playlistId]);

    return (
        <AuthContext.Provider value={{ user, setUser, courseId, isCourseCompleted, matchedCourse }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
