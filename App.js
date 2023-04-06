import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, TextInput, Button, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Picker } from '@react-native-picker/picker';

const db = SQLite.openDatabase('contacts.db');

export default function App(){

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');   
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [saveButtonText, setSaveButtonText] = useState('Save');
  
  const [deleteButton, setDeleteButtonText] = useState('Delete');
  const [contactId, setContactId] = useState(null);

  useEffect(() => {
    createTable();
    checkForData();
  }, []);

  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, firstName TEXT, lastName TEXT, address1 TEXT, address2 TEXT, city TEXT, province TEXT, country TEXT, postalCode TEXT, email TEXT, phoneNumber TEXT, imageUri TEXT)'
      );
    });
  };

  const checkForData = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM contacts LIMIT 1',
        null,
        (txObj, { rows }) => {
          if (rows.length > 0) {
            const { id, firstName, lastName, address1, address2, city, province, country, postalCode, email, phoneNumber, imageUri } = rows.item(0);
            setFirstName(firstName);
            setLastName(lastName);
            setAddress1(address1);
            setAddress2(address2);
            setCity(city);
            setProvince(province);
            setCountry(country);
            setPostalCode(postalCode);
            setEmail(email);
            setPhoneNumber(phoneNumber);
            setImageUri(imageUri);
            setSaveButtonText('Update');
            setDeleteButtonText('Delete');
            setContactId(id);
          }
        }
      );
    });
  };

  const saveContact = () => {
    if (validateInputs()) {
      if(contactId){updateContact();}
      else{addContact();}
    }
  };

  const addContact = () => {
    FileSystem.moveAsync({
      from: imageUri,
      to: `${FileSystem.documentDirectory}${firstName}${lastName}.jpg`
    }).then(() => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO contacts (firstName, lastName, address1, address2, city, province, country, postalCode, email, phoneNumber, imageUri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [firstName, lastName, address1, address2, city, province, country, postalCode, email, phoneNumber, `${FileSystem.documentDirectory}${firstName}${lastName}.jpg`],
          (txObj, { insertId }) => {
            setSaveButtonText('Update');
            setContactId(insertId);
            Alert.alert('Success', 'Contact Added successfully');
          },
          error => console.error(error)
        );
      });
    }).catch(error => console.error(error));
  };

  const deleteContact = () => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM CONTACTS WHERE id = ?',
        [contactId],
        () => {
          Alert.alert('Success', 'Contact deleted successfully');
          setFirstName('');
          setLastName('');
          setAddress1('');
          setAddress2('');
          setCity('');
          setProvince('');
          setCountry('');
          setPostalCode('');
          setEmail('');
          setPhoneNumber('');
          setImageUri(null);
          setSaveButtonText('Save');
          setContactId(null);
        },
        error => console.error(error)
      );
    });
  };

  const updateContact = () => {
    if (imageUri) {
      FileSystem.moveAsync({
        from: imageUri,
        to: `${FileSystem.documentDirectory}${firstName}${lastName}.jpg`
      }).then(() => {
        db.transaction(tx => {
          tx.executeSql(
            'UPDATE contacts SET firstName = ?, lastName = ?, address1 = ?, address2 = ?, city = ?, province = ?, country = ?, postalCode = ?, email = ?, phoneNumber = ?, imageUri = ? WHERE id = ?',
            [firstName, lastName, address1, address2, city, province, country, postalCode, email, phoneNumber, `${FileSystem.documentDirectory}${firstName}${lastName}.jpg`, contactId],
            () => {
              Alert.alert('Success', 'Contact updated successfully');
            },
            error => console.error(error)
          );
        });
      }).catch(error => console.error(error));
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE contacts SET firstName = ?, lastName = ?, address1 = ?, address2 = ?, city = ?, province = ?, country = ?, postalCode = ?, email = ?, phoneNumber = ? WHERE id = ?',
          [firstName, lastName, address1, address2, city, province, country, postalCode, email, phoneNumber, contactId],
          () => {
            Alert.alert('Success', 'Contact updated successfully');
          },
          error => console.error(error)
        );
      });
    }
  };

  const selectImage = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(status === 'granted'){
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    }else{
      Alert.alert('Permission needed', 'The app needs permission to access your photo librabry to select an image.')
    }
  };

  const validateInputs = () => {
    if (firstName === '' || lastName === '' || address1 === '' || city === '' || province === '' || country === '' || postalCode === '' || email === '' || phoneNumber === '') {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return false;
    }
    if (phoneNumber.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be 10 digits');
      return false;
    }
    if (imageUri && !imageUri.startsWith('file://')) {
      Alert.alert('Validation Error', 'Please select an image from your device');
      return false;
    }
    return true;
  };

  return(
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.title}>
        <Text style={styles.ti}>y_shah142873</Text>
        < Text style={styles.lab}>Lab-7 Contact Info App</Text>
      </View>
      <TouchableOpacity onPress={selectImage} style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{uri: imageUri}} style={styles.image} />
        ):(
          <Text style={styles.imagePlaceHolder}>Add Photo</Text>
        )}
      </TouchableOpacity>
      <View style={styles.inputContainer}>
          <View style={styles.name}>
          <TextInput 
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={text => setFirstName(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={text => setLastName(text)}
          />
          </View>
          <View style={styles.address}>
          <TextInput
            placeholder="Address1"
            style={styles.input}
            value={address1}
            onChangeText={text => setAddress1(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Address2"
            value={address2}
            onChangeText={text => setAddress2(text)}
          />
          </View>
          <TextInput
            style={styles.input}
            placeholder="City"
            value={city}
            onChangeText={text => setCity(text)}
          />
          <View style={styles.pickerInput}>
          <Picker
            style={styles.input}
            selectedValue={province}
            onValueChange={value => setProvince(value)}
            >
            <Picker.Item label="Alberta" value="AB" />
            <Picker.Item label="British Columbia" value="BC" />
            <Picker.Item label="Manitoba" value="MB" />
            <Picker.Item label="New Brunswick" value="NB" />
            <Picker.Item label="Newfoundland and Labrador" value="NL" />
            <Picker.Item label="Northwest Territories" value="NT" />
            <Picker.Item label="Nova Scotia" value="NS" />
            <Picker.Item label="Nunavut" value="NU" />
            <Picker.Item label="Ontario" value="ON" />
            <Picker.Item label="Prince Edward Island" value="PE" />
            <Picker.Item label="Quebec" value="QC" />
            <Picker.Item label="Saskatchewan" value="SK" />
            <Picker.Item label="Yukon" value="YT" />
          </Picker>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={country}
            onChangeText={text => setCountry(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Postal Code"
            value={postalCode}
            onChangeText={text => setPostalCode(text)}
          />
          <View style={styles.contact}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={text => setEmail(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={text => setPhoneNumber(text)}
          />
          </View>
      </View>
      <Button title={saveButtonText} onPress={saveContact} />
      <Button title={deleteButton} onPress={deleteContact} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ti:{
    fontSize: 20,
    paddingLeft: 30,
  },
  lab:{
    fontSize: 20,
    paddingBottom: 10,
  },
  imagePlaceHolder: {
    textAlign: 'center',
    marginTop: '50%',
    fontSize: 20,
    color: 'gray',
  },
  container: {
    marginTop: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageContainer: {
    width: 125,
    height: 125,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 100,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    textAlign: 'center',
    marginTop: '50%',
    fontSize: 20,
    color: 'gray',
  },
  name:{
    paddingTop:20,
    paddingBottom:10,
  },
  address:{
    paddingBottom: 10,
  },
  contact:{
    paddingTop: 10,
    paddingBottom: 10,
  },
  inputContainer: {
    width: '95%',
    marginBottom: 10,
  },
  input:{
    borderColor: '#ccc',
    borderWidth: 2,
    borderRadius: 3,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    backgroundColor: 'blue',
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});
