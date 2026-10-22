import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import { isStudentsResponse, normalizeName, type Student } from './studentLookupApi'
import './StudentLookup.css'

// This is the same Express API used by the Lab 6 transcript example.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`