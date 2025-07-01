import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'



const blogs = [
  { title: 'My new website', body: 'lorem ipsum...', author: 'mario', id: 1 },
  { title: 'Welcome party!', body: 'lorem ipsum...', author: 'luigi', id: 2 },
  { title: 'Web dev top tips', body: 'lorem ipsum...', author: 'yoshi', id: 3 },
  { title: 'npm or yarn?', body: 'lorem ipsum...', author: 'toad', id: 4 },
  { title: 'Why is my code slow?', body: 'lorem ipsum...', author: 'bowser', id: 5 },
]


const BlogCards = ({blog}) => {
  const [hasLiked , setHasLiked] = useState(false);
  return(
    <div className="card blog-card" style={{
      borderColor:'white',
      borderRadius: "10px",
      boxShadow: '0 4px 8px 0 rgba(181, 181, 181, 0.2)',
      margin: '20px'
    }}>
      <h1>{blog.title}</h1>
      <p>{blog.body}</p>
      <h6>
        written by {blog.author}
      </h6>
      <button className="like-btn" onClick={()=>{setHasLiked(!hasLiked)}}>
        {hasLiked ? "unlike" : "like"}
      </button>
    </div>
  )
}


function App(){
  return(
    <div className="blog-container" style={
      {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }
    }>
      {blogs.map(value=>{
        return <BlogCards blog={value} />
      })}
    </div>
  )
}
export default App

