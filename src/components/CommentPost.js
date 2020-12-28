// eslint-disable-next-line
import react , {Component, Fragment} from 'react';
// import { getComment } from '../graphql/queries';

class CommentPost extends Component {


    
    render(){
        // //console.log(`c`)
        const {content, commentOwnerUsername, createdAt} = this.props.commentData
        return(
            <div className='comment'>
                <span style={{ fontStyle: 'italic', color: '#0ca5e297'}}>
                    {'Comment by: '}{commentOwnerUsername}
                    {' on '}
                    <time style={{ fontStyle: 'italic'}}>
                        {' '}
                        { new Date(createdAt).toDateString()}
                    </time>
                </span>
                <p>{ content }</p>
            </div>
        )
    }

}

export default CommentPost;