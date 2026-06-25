import { Routes, Route, Navigate } from "react-router-dom";
import Library from "../pages/Library";
import Viewer from "../pages/Viewer";
import Statistics from "../pages/Statistics";
import AnnotationTest from "../pages/AnnotationTest";

function App() {
  return (
    <Routes>
      <Route path="/library" element={<Library />} />
      <Route path="/viewer/:id" element={<Viewer />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/annotation-test" element={<AnnotationTest />} />
      <Route path="/" element={<Navigate to="/library" replace />} />
    </Routes>
  );
}

export default App;
