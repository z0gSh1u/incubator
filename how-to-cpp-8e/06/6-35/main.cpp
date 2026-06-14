#include <iostream>
#include <time.h>
#include <cstdlib>

using namespace std;

int main()
{
LABEL:
	srand(time(0));
	int num=rand()%(1000-1+1)+1;
	cout << "I have a number between 1 and 1000." << endl << "Can you guess my number?" 
		 << endl << "Please type your first guess." << endl;

	int count=0,a=0;
	char yn;
	while (1)
	{
		cin >> a;
		count++;
		if (a==num)
		{
			cout << "Excellent! You guessed the number in " << count << " try (tries)" << endl;
			if (count<=10) cout << "Either you know the secret or you got lucky!" << endl;
			if (count==10) cout << "Ahah! You know the secret!" << endl;
			cout << "Would you like to play again (y or n)? ";
			cin >> yn;
			if (yn=='y') goto LABEL; else break;
		}
		if (a<num) cout << "Too low. Try again." << endl; else cout << "Too high. Try again." << endl;
	}		

	system("pause");
	return 0;
}