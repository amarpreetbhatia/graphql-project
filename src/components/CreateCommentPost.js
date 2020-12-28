// eslint-disable-next-line
import react , {Component, Fragment} from 'react';
import { API,Auth, graphqlOperation } from 'aws-amplify';
import { createComment } from '../graphql/mutations';

class CreateCommentPost extends Component {
    state = {
        commentOwnerId: '',
        commentOwnerUsername: '',
        content: ''
    }

    handleChangeContent = event => this.setState({
        content: event.target.value
    });

    handleAddComment = async event => {
        event.preventDefault();
        const input = {
            commentPostId: this.props.postId,
            commentOwnerId: this.state.commentOwnerId,
            commentOwnerUsername: this.state.commentOwnerUsername,
            content: this.state.content,
            createdAt: new Date().toISOString()
        }
        await API.graphql(graphqlOperation(createComment,{input}));
        this.setState({
            content: ''
        });
    }

    componentDidMount = async () => {
        await Auth.currentUserInfo()
          .then(user => {
              this.setState({
                commentOwnerId: user.attributes.sub,
                commentOwnerUsername: user.username
            })
          })

    }

    render(){
        return(
            <div>
                <form className='add-comment' onSubmit={this.handleAddComment}>
                    <textarea
                        type='text'
                        name='content'
                        rows='3'
                        cols='40'
                        required
                        placeholder='Add your Comment'
                        value={this.state.content}
                        onChange={this.handleChangeContent}
                    />
                    <input
                        type='submit'
                        className="btn"
                        style={{ fontSize: '19px'}}
                        value='Add Comment'/>
                </form>
            </div>
        )
    }
}

export default CreateCommentPost;
