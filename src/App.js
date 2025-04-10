import React, { useContext, useEffect, useRef } from 'react';
import WebViewer from '@pdftron/webviewer';
import './App.css';
import { AuthContext } from './Context/AuthContext';
import axios from 'axios';

const generateCertificateId = (userId, courseId, date) => {
  const userPart = userId?.slice(0, 4) || '0000';
  const coursePart = courseId?.slice(0, 4) || '0000';

  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  const formattedDate = `${year}${month}${day}`;
  return `${coursePart}${userPart}${formattedDate}`;
};

const formatDateReadable = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};


const App = () => {
  const viewer = useRef(null);
  const { user, courseId, isCourseCompleted, matchedCourse } = useContext(AuthContext);

  const completionDate = matchedCourse?.completionDate || new Date();

  const formattedDate = formatDateReadable(completionDate);

  const courseName = matchedCourse?.playListName || 'Unknown Course';

  const certificateId = generateCertificateId(user?._id, courseId, completionDate);

  const jsonData = {
    name: user?.name || 'Student',
    date: formattedDate,
    course: courseName,
    certificate_id: certificateId,
  };

  useEffect(() => {
    if (!isCourseCompleted || !user || !courseId || !completionDate) return;

    const saveCertificateToUser = async ({ userId, certificateId, courseName, date }) => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/addCertificate`, {
          userId,
          certificateId,
          courseName,
          date,
        });

        console.log("Certificate saved:", response.data);
      } catch (error) {
        console.error("Error saving certificate:", error);
      }
    };

    if (isCourseCompleted) {
      saveCertificateToUser({
        userId: user?._id,
        certificateId,
        courseName,
        date: completionDate,
      });
    }
  }, [isCourseCompleted, user, certificateId, courseName, completionDate]);

  useEffect(() => {
    if (!isCourseCompleted) return;

    WebViewer({
      path: '/webviewer/lib',
      licenseKey: '1744252485913:613505f803000000005f497107f39984149494d617bf1c53efc761b9a1',
      disabledElements: [
        'toolbarGroup-View',
        'toolbarGroup-Annotate',
        'toolbarGroup-Edit',
        'toolbarGroup-Shapes',
        'toolbarGroup-Insert',
        'toolbarGroup-FillAndSign',
        'toolbarGroup-Forms',
        'toolbarGroup-DataTab',
        'toolbarGroup-Redact',
        'toolbarGroup-NotesPanel',
        'panToolButton',
        'zoomOverlayButton',
        'selectToolButton',
        'highlightToolGroupButton',
        'underlineToolGroupButton',
        'strikeoutToolGroupButton',
        'freeHandToolGroupButton',
        'stickyToolGroupButton',
        'freeTextToolGroupButton',
        'signatureToolButton',
        'eraserToolButton',
      ],
      initialDoc: '/files/Presentation.pptx',
    }, viewer.current).then(async (instance) => {
      const { documentViewer } = instance.Core;

      if (!documentViewer) {
        console.error("documentViewer is not ready");
        return;
      }

      documentViewer.addEventListener('documentLoaded', async () => {
        const doc = documentViewer.getDocument();
        if (!doc) {
          console.error("Document not found");
          return;
        }

        await doc.getDocumentCompletePromise();

        try {
          await doc.applyTemplateValues(jsonData);
        } catch (error) {
          console.error("Error applying template values:", error);
        }
      });
    });
  }, [isCourseCompleted, certificateId, courseName, user]);

  if (!isCourseCompleted) {
    return (
      <div className="App">
        <div className="header">You Have Not Completed The Course, Please Complete The Course</div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="header">React sample</div>
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
