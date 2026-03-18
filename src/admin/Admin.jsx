import { Outlet } from 'react-router-dom'
import Navbar from './utility-components/navbar/Navbar'
import { Box } from '@mui/material'

const Admin = () => {
  return (
    <>
      <Navbar />
      <Box 
        sx={
          {
            minHeight:'100vh', 
            paddingTop: "70px", 
          }
        } 
        component={'div'}>
        <Outlet/>
      </Box>
    </>
  )
}

export default Admin
