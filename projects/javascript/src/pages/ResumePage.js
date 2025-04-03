// import React, { useState } from 'react';
// import Header from '../components/Header';
// import { useNavigate } from 'react-router-dom';

// /**
//  * ResumePage Component
//  * Handles resume request form submission and display
//  * Features:
//  * - Form validation
//  * - API integration with backend
//  * - Success/error message display
//  * - Form state management
//  * - Navigation to success page after submission
//  */
// function ResumePage() {
//   // Initialize navigation hook for redirecting after submission
//   const navigate = useNavigate();
  
//   // State for form data and submission status
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     message: '',
//   });
//   const [status, setStatus] = useState({ type: '', message: '' });

//   /**
//    * Handles form submission
//    * Sends form data to backend API
//    * Updates status based on API response
//    * Redirects to success page on success
//    */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setStatus({ type: 'loading', message: 'Submitting...' });

//     try {
//       console.log('Submitting form data:', formData);
//       const response = await fetch('http://localhost:5000/api/submit-resume', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();
//       console.log('Server response:', data);

//       if (!response.ok) {
//         throw new Error(data.details || data.error || 'Failed to submit form');
//       }

//       setStatus({
//         type: 'success',
//         message: 'Success! Redirecting to resume...',
//       });

//       // Redirect to resume PDF after a short delay
//       setTimeout(() => {
//         navigate('/resume-pdf');
//       }, 1500);
//     } catch (error) {
//       console.error('Submission error:', error);
//       setStatus({
//         type: 'error',
//         message: error.message || 'Failed to submit form. Please try again.',
//       });
//     }
//   };

//   /**
//    * Handles input field changes
//    * Updates formData state with new values
//    */
//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   return (
//     <div className="app-container">
//       <Header />
//       <div className="resume-container">
//         <h2>request resume</h2>
//         <p className="resume-intro">
//           Please fill out the form below to request my resume.
//         </p>
//         {/* Resume Request Form */}
//         <form className="resume-form" onSubmit={handleSubmit}>
//           {/* Name Input Field */}
//           <div className="form-group">
//             <label htmlFor="name">Name</label>
//             <input
//               type="text"
//               id="name"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           {/* Email Input Field */}
//           <div className="form-group">
//             <label htmlFor="email">Email</label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           {/* Phone Input Field */}
//           <div className="form-group">
//             <label htmlFor="phone">Phone</label>
//             <input
//               type="tel"
//               id="phone"
//               name="phone"
//               value={formData.phone}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           {/* Optional Message Textarea Field */}
//           <div className="form-group">
//             <label htmlFor="message">Message</label>
//             <textarea
//               id="message"
//               name="message"
//               value={formData.message}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           {/* Submit Button */}
//           <button type="submit" className="submit-button">
//             Submit
//           </button>
//           {/* Status Message Display */}
//           {status.message && (
//             <div className={`${status.type}-message`}>
//               {status.message}
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// }

// export default ResumePage; 