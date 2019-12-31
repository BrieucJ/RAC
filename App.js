import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Platform, SafeAreaView, StatusBar, Image, Button} from 'react-native';
import { Audio, Video } from "expo-av";
import {get, post} from './utilities/Api';

class PlaylistItem {
  constructor(name, uri) {
    this.name = name;
    this.uri = uri;
  }
}

const LOADING_STRING = "... loading ...";
const BUFFERING_STRING = "...buffering...";

const PLAYLIST = [
  new PlaylistItem(
    "Europe 1",
    "http://e1-live-aac-64.scdn.arkena.com/europe1.aac",
  )
];

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.index = 0;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.playbackInstance = null;
    this.state = {
      showVideo: false,
      playbackInstanceName: LOADING_STRING,
      muted: false,
      playbackInstancePosition: null,
      playbackInstanceDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isBuffering: false,
      isLoading: true,
      fontLoaded: false,
      shouldCorrectPitch: true,
      volume: 1.0,
      rate: 1.0,
      poster: false,
      useNativeControls: false,
      fullscreen: false,
      throughEarpiece: false
    };
  }

  componentDidMount() {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false
    })
    this._loadNewPlaybackInstance(true)
  }

  // componentDidUpdate(prevState){
  //   if (this.state.search !== prevState.search) {
  //     this.search(this.state.search)
  //   }
  // }

  // search = async (search) =>{
  //   console.log('SEARCH')
  //   let results = []
  //   this.state.radios.find(o => {
  //     if (o.name.includes(this.state.search)){
  //       results.push(o)
  //     }
  //   })
  //   if (results.length !== this.state.results) {
  //     console.log(results)
  //     await this.setState({results: results})
  //   }
  // }

  _onPlayPausePressed = () => {
    console.log('PRESSED')
    if (this.playbackInstance != null) {
      console.log('this.playbackInstance != null')
      if (this.state.isPlaying) {
        console.log('this.state.isPlaying')
        this.playbackInstance.pauseAsync();
      } else {
        this.playbackInstance.playAsync();
      }
    }
  };

  async _loadNewPlaybackInstance(playing) {
    if (this.playbackInstance != null) {
      await this.playbackInstance.unloadAsync();
      // this.playbackInstance.setOnPlaybackStatusUpdate(null);
      this.playbackInstance = null;
    }

    const source = { uri: PLAYLIST[this.index].uri };
    const initialStatus = {
      shouldPlay: playing,
      rate: this.state.rate,
      shouldCorrectPitch: this.state.shouldCorrectPitch,
      volume: this.state.volume,
      isMuted: this.state.muted,
      // // UNCOMMENT THIS TO TEST THE OLD androidImplementation:
      // androidImplementation: 'MediaPlayer',
    };

    const { sound, status } = await Audio.Sound.createAsync(
      source,
      initialStatus,
      this._onPlaybackStatusUpdate
    );
    this.playbackInstance = sound;

    this._updateScreenForLoading(false);
  }

  _updateScreenForLoading(isLoading) {
    if (isLoading) {
      this.setState({
        showVideo: false,
        isPlaying: false,
        playbackInstanceName: LOADING_STRING,
        playbackInstanceDuration: null,
        playbackInstancePosition: null,
        isLoading: true
      });
    } else {
      this.setState({
        playbackInstanceName: PLAYLIST[this.index].name,
        isLoading: false
      });
    }
  }

  _onPlaybackStatusUpdate = status => {
    if (status.isLoaded) {
      this.setState({
        playbackInstancePosition: status.positionMillis,
        playbackInstanceDuration: status.durationMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        isBuffering: status.isBuffering,
        rate: status.rate,
        muted: status.isMuted,
        volume: status.volume,
        shouldCorrectPitch: status.shouldCorrectPitch
      });
      if (status.didJustFinish && !status.isLooping) {
        this._advanceIndex(true);
        this._updatePlaybackInstanceForIndex(true);
      }
    } else {
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  _advanceIndex(forward) {
    this.index = (this.index + (forward ? 1 : PLAYLIST.length - 1)) % PLAYLIST.length;
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={false}/>
        <TextInput
          placeholder='Search'
          placeholderTextColor='white'
          style={{height: 40, borderColor: 'gray', borderWidth: 1, color: 'white', padding: 10}}
          onChangeText={(text) => this.setState({search: text})}
          value={this.state.search}
        />

        {this.state.results !== undefined && 
          <FlatList
            data={this.state.results}
            renderItem={({ item }) => {
               
              return(
                <View style={{flex: 1, flexDirection: 'row'}}>
                  <Text style={{color: 'white'}}>
                    {item.name}
                  </Text>
      
                </View>
              )}
            }
            keyExtractor={item => item.stationuuid}
          />
        }

        <Button
          title="Play"
          onPress={this._onPlayPausePressed}
        />

      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
});
