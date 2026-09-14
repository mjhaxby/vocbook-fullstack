import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from './pages/HomePage';
import VocabListPage from './pages/VocabListPage';
import VocabDetailPage from './pages/VocabDetailPage';
import VocabEditorPage from './pages/VocabEditorPage';
import TagLibraryPage from './pages/TagLibraryPage';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faEdit, faTrash, faPlus, faSave } from '@fortawesome/free-solid-svg-icons';
library.add(faEdit, faTrash, faPlus, faSave);

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
                  <Route path="/" element={<HomePage />} />       
                  <Route path="/dashboard" element={<HomePage />} />             
                  <Route path="/vocabs" element={<VocabListPage />} />
                  <Route path="/vocab/:id" element={<VocabDetailPage />} />
                  <Route path="/vocab/edit/:id" element={<VocabEditorPage />} />
                  <Route path="/tags/" element={<TagLibraryPage />} />
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
