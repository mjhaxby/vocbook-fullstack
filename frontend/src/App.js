import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import VocabListPage from './pages/VocabListPage';

function App() {
  const [vocabs, setVocabs] = useState([]);

  // useEffect(() => {
  //   axios.get('http://127.0.0.1:8000/api/vocabs/')
  //   .then(response => {
  //     setVocabs(response.data);
  //   })
  //   .catch(error => {
  //     console.error("There was an error fetching the vocabs!", error);
  //   });
  // }, []);

  return (
      <Router>
      <div className="vocbook-app">
        {/* <AuthProvider>
          <UserBar />
          <Header /> */}
          <main className="container">
            <Routes>
              {/* <Route path="/login" element={<LoginPage />} /> */}
              {/* <Route element={<Layout />} > */}
                {/* <Route element={<ProtectedRoute />}>               */}
                  {/* <Route path="/" element={<HomePage />} />        
                  <Route path="/dashboard" element={<HomePage />} />             */}
                  <Route path="/vocabs" element={<VocabListPage />} />
                {/* </Route> */}
              {/* </Route>               */}
            </Routes>
          </main>
         {/* </AuthProvider> */}

      </div>
    </Router>    
  )
}

export default App;
