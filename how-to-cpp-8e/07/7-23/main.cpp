#include <iostream>
#include <stdio.h>
#include <cstdlib>

using namespace std;

bool MyFloor[20][20]={0};  // [X][Y] ~ [ROW][COLOUM]
int command[1000][2]={0};
char direction='R';
bool isPenDown=false;
int curPos[2]={0,0};
int commandLen;

void readCommand()
{
	int tmp;
	int mark=0;
	scanf("%d",&tmp);
	while (tmp!=9)
	{
		command[mark][0]=tmp;
		if (tmp==5) scanf(",%d",&command[mark][1]);
		mark++;
		scanf("%d",&tmp);
	}
	command[mark][0]=9;
	commandLen=mark;
}

void moveit(int len)
{
	switch (direction)
	{
	case 'R':
		if (isPenDown)
			for (int i=1; i<=len; i++) 
				MyFloor[curPos[0]][curPos[1]+i]=true;
		curPos[1]+=len;
		break;
	case 'L':
		if (isPenDown)
			for (int i=1; i<=len; i++) 
				MyFloor[curPos[0]][curPos[1]-i]=true;
		curPos[1]-=len;
		break;
	case 'U':
		if (isPenDown)
			for (int i=1; i<=len; i++) 
				MyFloor[curPos[0]-i][curPos[1]]=true;
		curPos[0]-=len;
		break;
	case 'D':
		if (isPenDown)
			for (int i=1; i<=len; i++) 
				MyFloor[curPos[0]+i][curPos[1]]=true;
		curPos[0]+=len;
		break;
	}
}

void printMap()
{
	for (int i=0; i<=19; i++)
	{
		for (int j=0; j<=19; j++)
		{
			char outWhat=(MyFloor[i][j] ? '*' : ' ');
			cout << outWhat;
		}
		cout << '\n';
	}
}

void process()
{
	for (int i=0;i<commandLen;i++)
	{
		switch (command[i][0])
		{
		case 1:
			isPenDown=false; break;
		case 2:
			isPenDown=true; break;
		case 3:  // Turn Right
			switch (direction)
			{
			case 'R':
				direction='D'; break;
			case 'L':
				direction='U'; break;
			case 'U':
				direction='R'; break;
			case 'D':
				direction='L'; break;
			};
			break;
		case 4:  // Turn Left
			switch (direction)
			{
			case 'R':
				direction='U'; break;
			case 'L':
				direction='D'; break;
			case 'U':
				direction='L'; break;
			case 'D':
				direction='R'; break;
			};
			break;
		case 5:
			moveit(command[i][1]);
			break;
		case 6:
			printMap(); break;
		default:
			break;
		}
	}
}

int main()
{
	cout << ">>" << endl;
	readCommand();
	process();
	system("pause");
	return 0;
}