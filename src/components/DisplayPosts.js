// eslint-disable-next-line
import react , {Component} from 'react';
import { listPosts } from '../graphql/queries';
import {onCreateComment, onCreateLike, onCreatePost, onDeletePost, onUpdatePost} from '../graphql/subscriptions';
import {createLike} from '../graphql/mutations';
import {API, Auth, graphqlOperation} from 'aws-amplify';
import DeletePost from './DeletePost';
import EditPost from './EditPost';
import CreateCommentPost from './CreateCommentPost';
import CommentPost from './CommentPost';
import UsersWhoLikedPost from './UsersWhoLikedPost';
import { FaSadTear, FaThumbsUp } from 'react-icons/fa';


class DisplayPosts extends Component {

    state = {
        ownerId: '',
        ownerUsername: '',
        errorMessage: '',
        postLikedBy: [],
        isHovering: false,
        posts: []
    }
    componentDidMount = async() => {
        this.getPosts();
        await Auth.currentUserInfo()
           .then(user => {
               this.setState({
                   ownerId: user.attributes.sub,
                   ownerUsername: user.username
               })
           });

        this.createPostListener = API.graphql(graphqlOperation(onCreatePost))
         .subscribe({
            next: postData => {
                // console.log(`postData onCreate call ${JSON.stringify(postData)}`)
                const newPost = postData.value.data.onCreatePost;
                const prevPosts = this.state.posts.filter( post => post.id !== newPost.id);
                const updatedPost = [newPost, ...prevPosts]
                this.setState({
                    posts: updatedPost
                })
            }
        })

        this.deletePostListener = API.graphql(graphqlOperation(onDeletePost))
          .subscribe({
              next: postData => {
                  const deletedPost = postData.value.data.onDeletePost
                  const updatedPost = this.state.posts.filter(post => post.id !== deletedPost.id)
                  this.setState({
                      posts: updatedPost
                  })
              }
          })
        
        this.updatePostListener = API.graphql(graphqlOperation(onUpdatePost))
           .subscribe({
               next: postData => {
                   const { posts } = this.state
                   const updatedPost = postData.value.data.onUpdatePost
                   const index = posts.findIndex(post => post.id === updatedPost.id)
                   const updatedPosts = [
                       ...posts.slice(0,index),
                        updatedPost,
                        ...posts.slice(index +1)
                    ]

                   this.setState({
                       posts: updatedPosts
                   }) 
               }
           })
        
        this.createPostCommentListener = API.graphql(graphqlOperation(onCreateComment))
           .subscribe({
               next: commentData => {
                   const createdComment = commentData.value.data.onCreateComment
                   let posts = [...this.state.posts]

                   for(let post of posts){
                       if(createdComment.post.id === post.id){
                           post.comments.items.push(createdComment)
                       }
                   }
                   this.setState({
                       posts
                   })
               }
           })

           this.createPostLikeListener = API.graphql(graphqlOperation(onCreateLike))
               .subscribe({
                   next: postData => {
                        const createLike = postData.value.data.onCreateLike;
                        let posts = [...this.state.posts]
                        for(let post of posts) {
                            if(createLike.post.id === post.id){
                                post.likes.items.push(createLike)
                            }
                        }
                        this.setState({
                            posts
                        })
                   }
               })
    }

    handleLike = async postId => {
        if (this.likedPost(postId)) {return this.setState({errorMessage: "Can't Like Your Own Post."})} else {
           const input = {
               numberLikes: 1,
               likeOwnerId: this.state.ownerId,
               likeOwnerUsername: this.state.ownerUsername,
               likePostId: postId
          }
          try {
             const result =  await API.graphql(graphqlOperation(createLike, { input }))
              console.log("Liked: ", result.data);
              
          }catch (error) {
               console.error(error)
               
          }
        }
      
   }


    componentWillUnmount() {
        this.createPostListener.unsubscribe();
        this.deletePostListener.unsubscribe();
        this.updatePostListener.unsubscribe();
        this.createPostCommentListener.unsubscribe();
        this.createPostLikeListener.unsubscribe();
    }

    getPosts = async () => {
        const result = await API.graphql(graphqlOperation(listPosts));
        // console.log(`All Posts: ${JSON.stringify(result?.data?.listPosts?.items)}`);
        this.setState({
            posts: result?.data?.listPosts?.items
        })
    }

    handleMouseHover = async (postId) => {
        this.setState({
            isHovering: !this.state.isHovering
        })
        let innerLikes = this.state.postLikedBy;
        for(let post of this.state.posts) {
            if(post.id === postId) {
                for(let like of post.likes.items) {
                    innerLikes.push(like.likeOwnerUsername);
                }
            }
        }
        this.setState({
            postLikedBy: innerLikes
        });

        console.log("Post liked by ", this.state.postLikedBy);
    }

    handleMouseHoverLeave = async () => {
        this.setState({
            isHovering: !this.state.isHovering,
        })
        this.setState({
            postLikedBy: []
        })
    }
    likedPost = (postId) => {

        for(let post of this.state.posts) {
            if(post.id === postId){
                if(post.postOwnerId === this.state.ownerId){
                    return true;
                }
                for(let like of post.likes.items){
                    if(like.likeOwnerId === this.state.ownerId){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    render(){
        const { posts } = this.state;
        let loggedInUser = this.state.ownerId;
        
        return posts.map((post) => {
               return (
               <div className="posts" style={rowStyle} key={post.id}>
                   <h1>{post.postTitle}</h1>
                   <h2>{post.postBody}</h2>
                   <span style={{ fontStyle: 'italic', color: '#0ca5e297'}}>{"Posted by: "} {post.postOwnerUsername}</span>
                   {" on "}
                   <time style={{ fontStyle: 'italic'}}>
                       {" "}
                       { new Date(post.createdAt).toDateString()}
                   </time>
                   <br/>
                   { post.postOwnerId === loggedInUser && <EditPost {...post}/>}
                   { post.postOwnerId === loggedInUser && <DeletePost data={post}/>}

                   <span>
                       <p className="alert" >{post.postOwnerId ===loggedInUser && this.state.errorMessage}</p>
                       <p 
                          onMouseEnter={() => this.handleMouseHover(post.id)}
                          onMouseLeave={() => this.handleMouseHoverLeave()}
                          onClick={() => this.handleLike(post.id)}
                          style={{color: (post.likes.items.length > 0) ? "blue" : "grey"}}
                          className="like-button"
                          ><FaThumbsUp />
                       {post.likes.items.length}
                       </p>

                        {this.state.isHovering && 
                            <div className="user-liked">
                                {this.state.postLikedBy.length === 0 ?
                                 "Liked by no one" : 
                                  "Liked by"  
                                 }
                                 {this.state.postLikedBy.length === 0 ?
                                  <FaSadTear/> :
                                   <UsersWhoLikedPost data={this.state.postLikedBy}/>
                                }
                            </div>
                        }

                   </span>

                   <span>
                       <CreateCommentPost postId={post.id}/>
                       { post.comments.items.length > 0 && <span style={{fontSize: '19px', colot: 'grey'}}>
                            comments: 
                           </span>}
                           {
                               post.comments.items.map((comment, index) => <CommentPost key={index} commentData={comment}/>)
                           }
                   </span>

               </div>)
                })
    }
};

const rowStyle = {
    background: '#f4f4f4',
    padding: '10px',
    border: '1px #ccc dotted',
    margin: '14px'
}
export default DisplayPosts;