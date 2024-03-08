import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text, Input, Button} from '@rneui/base';
import {colors} from './Colors';

type Props = {
  onSubmit: ({name, description}: {name: string, description: string}) => void;
};

export function CreateToDoPrompt(props: Props): React.ReactElement<Props> {
  const {onSubmit} = props;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <View style={styles.modalWrapper}>
      <Text h4 style={styles.addItemTitle}>
        Add Item
      </Text>
      <Input
        placeholder="What is this item called?"
        onChangeText={(text: string) => setName(text)}
      />
      <Input
        placeholder="Describe some identifying features"
        onChangeText={(text: string) => setDescription(text)}
      />
      <Button
        title="Save"
        buttonStyle={styles.saveButton}
        disabled={!name || !description}
        onPress={() => onSubmit({name, description})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    width: 300,
    minHeight: 400,
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  addItemTitle: {
    margin: 20,
  },
  saveButton: {
    width: 280,
    backgroundColor: colors.primary,
  },
});
